pipeline {
    agent {
        dockerfile {
            filename 'DockerfileJenkins'
            args '-v /opt/:/opt/ -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    stages {
        stage('build docker') {
            steps {
                sh 'id'
                script {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'ecr-eu-jenkins', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                        docker.withRegistry("https://255382753382.dkr.ecr.eu-central-1.amazonaws.com", "ecr:eu-central-1:ecr-eu-jenkins") {
                            docker.build('cloudmapper-service', '--build-arg AWS_ACCESS_KEY_ID --build-arg AWS_SECRET_ACCESS_KEY .')
                            docker.image("cloudmapper-service").push("v_"+env.BUILD_NUMBER)
                            docker.image("cloudmapper-service").push("latest")
                        }
                    }
                }
            }
        }
        stage('deploy to it') {
            when {
                branch 'master'
            }
            steps {
                echo 'deploy to it'
                script {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'ecr-eu-jenkins', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                        sh '''#!/bin/bash
    SERVICE_NAME="cloudmapper-it"
    IMAGE_TAG="v_"${BUILD_NUMBER}
    CLUSTER_NAME="paulalex-it"
    sed -i "s;%IMAGE_VERSION%;${IMAGE_TAG};g" task-definition.json
	sed -i "s;%ENVIRONMENT%;it;g" task-definition.json
    export AWS_DEFAULT_REGION="eu-central-1"
    # Create a new task definition for this build
    aws ecs register-task-definition --family ${SERVICE_NAME} --cli-input-json file://task-definition.json
    # Update the service with the new task definition and desired count
    TASK_REVISION=`aws ecs describe-task-definition --task-definition ${SERVICE_NAME} | egrep "revision" | tr "/" " " | awk '{print $2}' | tr "," " " | sed 's/"$//'`
    DESIRED_COUNT=`aws ecs describe-services --services ${SERVICE_NAME} --cluster ${CLUSTER_NAME} | egrep "desiredCount" -m1 | tr "/" " " | awk '{print $2}' | sed 's/,$//'`
    if [ "${DESIRED_COUNT}" = "0" ]; then
        DESIRED_COUNT="1"
    fi
    aws ecs update-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --task-definition ${SERVICE_NAME}:${TASK_REVISION} --desired-count ${DESIRED_COUNT}'''
                    }
                }
            }
        }
    }
}
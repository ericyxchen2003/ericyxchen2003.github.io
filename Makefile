.PHONY: resume validate-resume

resume:
	./scripts/build_resume.sh

validate-resume:
	./scripts/validate_resume.sh files/Resume_Chen_Yixiang.pdf
